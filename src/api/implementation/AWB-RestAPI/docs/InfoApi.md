# InfoApi

All URIs are relative to *https://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**eventLogGet**](#eventlogget) | **GET** /eventLog | get logs of specific type|
|[**getAppSettings**](#getappsettings) | **GET** /app/settings/get | Returns required base configuration settings for the curren web application|
|[**installationDetailsGet**](#installationdetailsget) | **GET** /installationDetails | Get the details about an AWB Installation|
|[**isUpdateAvailableGet**](#isupdateavailableget) | **GET** /isUpdateAvailable | Checks wether an update for the AWB is available or not|
|[**setAppSettings**](#setappsettings) | **PUT** /app/settings/set | Enables to update or set the required base configuration settings for the curren web application|
|[**versionGet**](#versionget) | **GET** /version | Return the current version number of Agent.Workbench|

# **eventLogGet**
> Array<Event> eventLogGet()


### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

let type: EventLogTypes; //The type which is retrieved by awb (default to undefined)
let amount: number; //the maximum number of logs to retrieve. If no number is specified the default is 10 (optional) (default to 10)

const { status, data } = await apiInstance.eventLogGet(
    type,
    amount
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **type** | **EventLogTypes** | The type which is retrieved by awb | defaults to undefined|
| **amount** | [**number**] | the maximum number of logs to retrieve. If no number is specified the default is 10 | (optional) defaults to 10|


### Return type

**Array<Event>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Return Logs of specified type |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAppSettings**
> Properties getAppSettings()

Returns required base configuration settings for the curren web application

### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

const { status, data } = await apiInstance.getAppSettings();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Properties**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Current application settings |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **installationDetailsGet**
> Array<BundleInformation> installationDetailsGet()


### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

const { status, data } = await apiInstance.installationDetailsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<BundleInformation>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Return the Details about an AWB Installtion |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **isUpdateAvailableGet**
> boolean isUpdateAvailableGet()


### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

const { status, data } = await apiInstance.isUpdateAvailableGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**boolean**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | request successful. boolean in response indicates wether update is available or not |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setAppSettings**
> setAppSettings()

Enables to update or set the required base configuration settings for the curren web application

### Example

```typescript
import {
    InfoApi,
    Configuration,
    Properties
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

let properties: Properties; //The new settings (optional)

const { status, data } = await apiInstance.setAppSettings(
    properties
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **properties** | **Properties**| The new settings | |


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully changed base settings |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **versionGet**
> Version versionGet()


### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

const { status, data } = await apiInstance.versionGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Version**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request was successful and user receives versionNumber |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

