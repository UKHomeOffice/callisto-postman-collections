const personId = pm.environment.get('personId');
const agreementsUrl = pm.environment.replaceIn("{{accruals_service_url}}/resources/agreements?tenantId={{tenantId}}&filter=personId=='{{personId}}'");
const accrualsUrl = pm.environment.replaceIn("{{accruals_service_url}}/resources/accruals?tenantId={{tenantId}}");
const agreementTargtsUrl = pm.environment.replaceIn("{{accruals_service_url}}/resources/agreement-targets?tenantId={{tenantId}}");


const buildRequest = function(method, url) {
  return {
    url: url,
    method: method,
    header: {
      'Content-Type': 'application/json'
    }
  };
};

const deleteAccrualsByAgreementId = function(agreementId) {
  const filter = `&filter=agreementId=="${agreementId}"`;
  let request = buildRequest('GET', accrualsUrl+filter);

  pm.sendRequest(request, function (error, result) {
    if (result.code == '200') {
      const accrualIds = result.json().items.map(accrual => accrual.id);
      console.log(accrualIds);

      for (const accrualId of accrualIds) {

        let accrualsSingleResourceUrl = `{{accruals_service_url}}/resources/accruals/${accrualId}?tenantId={{tenantId}}`;

        let deleteRequest = buildRequest('DELETE', pm.environment.replaceIn(accrualsSingleResourceUrl));
        //console.log(deleteRequest);

        pm.sendRequest(deleteRequest, function (error, result) {
          if (result.code == '200') {
            console.log(`Accrual "${accrualId}" deleted successfully`);
          }
        });
      }

    }
  });
}

const deleteAgreementTargetsByAgreementId = function(agreementId) {
  const filter = `&filter=agreementId=="${agreementId}"`;
  let request = buildRequest('GET', agreementTargtsUrl+filter);

  pm.sendRequest(request, function (error, result) {
    if (result.code == '200') {
      const agreementTargtIds = result.json().items.map(agreementTarget => agreementTarget.id);
      console.log(agreementTargtIds);

      for (const agreementTargtId of agreementTargtIds) {

        let agreementTargetsSingleResourceUrl = `{{accruals_service_url}}/resources/agreement-targets/${agreementTargtId}?tenantId={{tenantId}}`;

        let deleteRequest = buildRequest('DELETE', pm.environment.replaceIn(agreementTargetsSingleResourceUrl));
        //console.log(deleteRequest);

        pm.sendRequest(deleteRequest, function (error, result) {
          if (result.code == '200') {
            console.log(`Agreement Target "${agreementTargtId}" deleted successfully`);
          }
        });
      }

    }
  });
}

const deleteAgreementById = function(agreementId) {

  let agreementsSingleResourceUrl = `{{accruals_service_url}}/resources/agreements/${agreementId}?tenantId={{tenantId}}`;

  let deleteRequest = buildRequest('DELETE', pm.environment.replaceIn(agreementsSingleResourceUrl));

  pm.sendRequest(deleteRequest, function (error, result) {
    if (result.code == '200') {
      console.log(`Agreement "${agreementId}" deleted successfully`);
    }
  });

}

let request = buildRequest('GET', agreementsUrl);

pm.sendRequest(request, function (error, result) {
      if (result.code == '200') {
        const agreementIds = result.json().items.map(agreement => agreement.id);
        console.log(agreementIds);

        for (const agreementId of agreementIds) {
          deleteAgreementTargetsByAgreementId(agreementId);
          deleteAccrualsByAgreementId(agreementId);
          deleteAgreementById(agreementId);
        }
      }
    }
);
