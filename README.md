# Callisto Postman Collections
Repository for re-usable Postman collections and scripts

## Before you start

1. Import `Agreement Resource setup` collection (`agreement-resrouce-set-up.postman_collection.json`) and
   `Agreement setup` environment (`agreement-resrouce-set-up.postman_environment.json`) in Postman
2. Select `Agreement setup` environment and set values for the following environment variables:
   `accruals_service_url`, `tenantId` and `personId`

## Agreement Resource setup Collection 

`Agreement Resource setup` collection is composed of two requests:

### Set up Agreement Resources (POST)

The `POST` request itself creates an _Agreement_ resource using the `tenantId` and `personId` values 
set in the `Agreement setup` environment.
The `Tests` script then creates _Accrual_ placeholders and _Agreement Targets_

### Tear down Agreement Resources (GET)

The `GET` request itself gets all _Agreement_ resources for the `tenantId` and `personId` values 
set in the `Agreement setup` environment.
The `Tests` script then iterates through each _agreementId_ and delete all _Accrual_ and 
_Agreement Target_ records for that _agreementId_ 
