let jsonData = JSON.parse(responseBody);
const agreementIds = jsonData.items.map(agreement => agreement.id);
const personId = pm.environment.get('personId');
const loggingEnabled = pm.environment.get('loggingEnabled') === 'true';

const accrualsUrl = pm.environment.replaceIn(
    "{{accruals_service_url}}/resources/accruals?size=1000&tenantId={{tenantId}}");
const agreementTargetsUrl = pm.environment.replaceIn(
    "{{accruals_service_url}}/resources/agreement-targets?size=1000&tenantId={{tenantId}}");

const buildRequest = function (method, url) {
  return {
    url: url,
    method: method,
    header: {
      'Content-Type': 'application/json'
    }
  };
};

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

const deleteAccrualsByAgreementId = async function (agreementId) {
  const filter = `&filter=agreementId=="${agreementId}"`;
  let request = buildRequest('GET', accrualsUrl + filter);

  let result = await sendRequest(request);
  if (result.code === 200) {
    const accrualIds = result.json().items.map(accrual => accrual.id);

    for (const accrualId of accrualIds) {

      let accrualsSingleResourceUrl = `{{accruals_service_url}}/resources/accruals/${accrualId}?tenantId={{tenantId}}`;

      let deleteRequest = buildRequest('DELETE',
          pm.environment.replaceIn(accrualsSingleResourceUrl));

      let result = await sendRequest(deleteRequest);
      if (result.code === 200 && loggingEnabled) {
        console.log(`Accrual "${accrualId}" deleted successfully`);
      }
    }

  }
}

const deleteAgreementTargetsByAgreementId = async function (agreementId) {
  const filter = `&filter=agreementId=="${agreementId}"`;
  let request = buildRequest('GET', agreementTargetsUrl + filter);

  let result = await sendRequest(request);
  if (result.code === 200) {
    const agreementTargetIds = result.json().items.map(
        agreementTarget => agreementTarget.id);

    for (const agreementTargetId of agreementTargetIds) {

      let agreementTargetsSingleResourceUrl =
          `{{accruals_service_url}}/resources/agreement-targets/${agreementTargetId}?tenantId={{tenantId}}`;
      let deleteRequest = buildRequest('DELETE',
          pm.environment.replaceIn(agreementTargetsSingleResourceUrl));

      let result = await sendRequest(deleteRequest);
      if (result.code === 200 && loggingEnabled) {
        console.log(
            `Agreement Target "${agreementTargetId}" deleted successfully`);
      }
    }
  }
}

const deleteAgreementById = async function (agreementId) {

  let agreementsSingleResourceUrl
      = `{{accruals_service_url}}/resources/agreements/${agreementId}?tenantId={{tenantId}}`;

  let deleteRequest = buildRequest('DELETE',
      pm.environment.replaceIn(agreementsSingleResourceUrl));

  let result = await sendRequest(deleteRequest);
  if (result.code === 200 && loggingEnabled) {
    console.log(`Agreement "${agreementId}" deleted successfully`);
  }
}

const deleteAll = async function (agreementIds) {
  for (const agreementId of agreementIds) {
    await deleteAgreementTargetsByAgreementId(agreementId);
    await deleteAccrualsByAgreementId(agreementId);
    await deleteAgreementById(agreementId);
  }
}

deleteAll(agreementIds).then(() => console.log('Agreement data teardown complete!'));
