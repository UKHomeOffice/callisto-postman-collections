const personId = pm.environment.get('personId');
var agreementsUrl = pm.environment.replaceIn("{{accruals_service_url}}/resources/agreements?tenantId={{tenantId}}&filter=personId=='{{personId}}'");
var accrualsUrl = pm.environment.replaceIn("{{accruals_service_url}}/resources/accruals?tenantId={{tenantId}}");
var agreementTargtsUrl = pm.environment.replaceIn("{{accruals_service_url}}/resources/agreement-targets?tenantId={{tenantId}}");


const buildRequest = function(method, url) {
  var request = {
    url: url,
    method: method,
    header: {
      'Content-Type': 'application/json'
    }
  };
  return request;
};

const deleteAccrualsByAgreementId = function(agreementId) {
  const filter = `&filter=agreementId=="${agreementId}"`;
  var request = buildRequest('GET', accrualsUrl+filter);

  pm.sendRequest(request, function (error, result) {
    if (result.code == '200') {
      const accrualIds = result.json().items.map(accrual => accrual.id);
      console.log(accrualIds);

      for (const accrualId of accrualIds) {

        var accrualsSingleResourceUrl = `{{accruals_service_url}}/resources/accruals/${accrualId}?tenantId={{tenantId}}`;

        var deleteRequest = buildRequest('DELETE', pm.environment.replaceIn(accrualsSingleResourceUrl));
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
  var request = buildRequest('GET', agreementTargtsUrl+filter);

  pm.sendRequest(request, function (error, result) {
    if (result.code == '200') {
      const agreementTargtIds = result.json().items.map(agreementTarget => agreementTarget.id);
      console.log(agreementTargtIds);

      for (const agreementTargtId of agreementTargtIds) {

        var agreementTargetsSingleResourceUrl = `{{accruals_service_url}}/resources/agreement-targets/${agreementTargtId}?tenantId={{tenantId}}`;

        var deleteRequest = buildRequest('DELETE', pm.environment.replaceIn(agreementTargetsSingleResourceUrl));
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

var request = buildRequest('GET', agreementsUrl);

pm.sendRequest(request, function (error, result) {
      if (result.code == '200') {
        const agreementIds = result.json().items.map(agreement => agreement.id);
        console.log(agreementIds);

        for (const agreementId of agreementIds) {
          deleteAgreementTargetsByAgreementId(agreementId);
          deleteAccrualsByAgreementId(agreementId);
        }
      }
    }
);

