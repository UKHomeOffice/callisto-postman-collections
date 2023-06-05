const jsonData = JSON.parse(responseBody);
const agreementId = jsonData.items[0].id
postman.setEnvironmentVariable("agreementId", agreementId);
const agreementStartDate =  jsonData.items[0].startDate;
const agreementEndDate =  jsonData.items[0].endDate;
const loggingEnabled = pm.environment.get('loggingEnabled') === 'true';

const accrualsUrl = pm.environment.replaceIn(
    "{{accruals_service_url}}/resources/accruals?tenantId={{tenantId}}");
const agreementTargetsUrl = pm.environment.replaceIn(
    "{{accruals_service_url}}/resources/agreement-targets?tenantId={{tenantId}}");

const agreementTargets = {
  "e502eebb-4663-4e5b-9445-9a20441c18d9": 2192,// Annual Target Hours
  "5f06e6ce-1422-4a0c-89dd-f4952e735202": 104// Night Hours
};
// "05bbd915-e907-4259-a2e2-080d7956afec": 286,// Weekend Hours
// "b94bb25a-7fe2-4599-91ab-f0d58e013aed": 32,// Public Holidays
// "2a5ea69d-1a2c-409d-b430-43a5dbc403b3": 50,// On-call Weekday
// "df4c4b08-ac4a-45e0-83bb-856d3219a8b3": 35,// On-call Weekend
// "a628bf34-d834-437d-a57a-ed549bd9a330": 2,// On-call Public Holiday
// "c4fd5435-8239-4f1f-9c4b-7f458b7b636d": 0,// Flexible Credits
// "c73030ed-ed28-4d59-85e8-185f70d85a94": 0,// Rostered Shift Allowance
// "787d2d12-2aff-4253-b382-bcefded61124": 64,// Public Holiday Credit
// };

const accrualTypes = {
  "e502eebb-4663-4e5b-9445-9a20441c18d9": "Annual Target Hours",
  "5f06e6ce-1422-4a0c-89dd-f4952e735202": "Night Hours"
};
//     "05bbd915-e907-4259-a2e2-080d7956afec": "Weekend Hours",
//     "b94bb25a-7fe2-4599-91ab-f0d58e013aed": "Public Holidays",
//     "2a5ea69d-1a2c-409d-b430-43a5dbc403b3": "On-call Weekday",
//     "df4c4b08-ac4a-45e0-83bb-856d3219a8b3": "On-call Weekend",
//     "a628bf34-d834-437d-a57a-ed549bd9a330": "On-call Public Holiday",
//     "c4fd5435-8239-4f1f-9c4b-7f458b7b636d": "Flexible Credits",
//     "c73030ed-ed28-4d59-85e8-185f70d85a94": "Rostered Shift Allowance",
//     "787d2d12-2aff-4253-b382-bcefded61124": "Public Holiday Credit"
// };

pm.sendRequest("https://cdnjs.cloudflare.com/ajax/libs/js-joda/1.11.0/js-joda.min.js", (err, res) => {
  //convert the response to text and save it as an environment variable
  pm.collectionVariables.set("jsjoda_library", res.text());

  // eval will evaluate the JavaScript code and initialize the min.js
  eval(pm.collectionVariables.get("jsjoda_library"));

  console.log("Agreement Start Date:", agreementStartDate);
  console.log("Agreement End Date:", agreementEndDate);

  const datesBetween = function(start, end) {
    let startDate = JSJoda.LocalDate.parse(start);
    let endDate = JSJoda.LocalDate.parse(end);
    let arr = [];
    for(let dt=startDate; !dt.isAfter(endDate); dt=dt.plusDays(1)){
      arr.push(dt);
    }
    return arr;
  };

  const buildAccrual = function(accrualDate, accrualTypeId, cumulativeTarget, cumulativeTotal) {
    return  {
      "tenantId": pm.environment.get('tenantId'),
      "personId": pm.environment.get('personId'),
      "agreementId": pm.environment.get('agreementId'),
      "accrualTypeId": accrualTypeId,
      "accrualDate": accrualDate,
      "cumulativeTarget": cumulativeTarget,
      "cumulativeTotal": cumulativeTotal,
      "contributions": {
        "timeEntries": {},
        "total": 0
      }
    };
  }

  function sendRequest(req) {
    return new Promise((resolve, reject) => {
      pm.sendRequest(req, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      })
    });
  }

  const creatAccrualPlaceholders = async function(accrualDates, accrualTypes) {
    for (const accrualDate of accrualDates) {
      pm.collectionVariables.set("accrualDate", accrualDate);
      for (const [key, value] of Object.entries(accrualTypes)) {

        // accrualTypes map is key'd by accrualTypeId, so key == accrualTypeId
        let request = buildRequest('POST', accrualsUrl, buildAccrual(accrualDate, key, 0, 0));

        let result = await sendRequest(request);
        if (result.code === 200 && loggingEnabled) {
          console.log(
              `"${value}" Accrual placeholder created successfully for ${accrualDate}`);
        }
      }
    }
  }

  const createAgreementTargets = async function(agreementTargets, accrualTypes) {
    for (const [key, value] of Object.entries(agreementTargets)) {
      let accrualType = accrualTypes[key];

      // agreementTargets map is key'd by accrualTypeId, so key == accrualTypeId and value = totalTarget
      let request = buildRequest('POST', agreementTargetsUrl, buildAgreementTarget(key, value));
      let result = await sendRequest(request)
      if (result.code === 200 && loggingEnabled) {
        console.log(`"${accrualType}" Agreement Target created successfully`);
      }
    }
  }

  const buildAgreementTarget = function(accrualTypeId, targetTotal) {
    return {
      "tenantId": pm.environment.get('tenantId'),
      "agreementId": pm.environment.get('agreementId'),
      "accrualTypeId": accrualTypeId,
      "targetTotal": targetTotal
    };
  }

  const buildRequest = function(method, url, body) {
    return {
      url: url,
      method: method,
      header: {
        'Content-Type': 'application/json'
      },
      body: {
        mode: 'raw',
        raw: JSON.stringify(body)
      }
    };
  }

  const accrualDates = datesBetween(agreementStartDate,agreementEndDate);

  const createAll = async function (accrualDates, accrualTypes, agreementTargets) {
    await creatAccrualPlaceholders(accrualDates, accrualTypes);
    await createAgreementTargets(agreementTargets, accrualTypes)
  }

  createAll(accrualDates, accrualTypes, agreementTargets)
  .then(() => console.log('Agreement data setup complete!'));

});