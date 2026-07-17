# InfoApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**aliveGet**](#aliveget) | **GET** /alive | |
|[**eventLogGet**](#eventlogget) | **GET** /eventLog | get logs of specific type|
|[**getAppSettings**](#getappsettings) | **GET** /app/settings/get | Returns required base configuration settings for the curren web application|
|[**setAppSettings**](#setappsettings) | **PUT** /app/settings/set | Enables to update or set the required base configuration settings for the curren web application|
|[**versionGet**](#versionget) | **GET** /version | Return the current version number of Agent.Workbench|

# **aliveGet**
> string aliveGet()


### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

const { status, data } = await apiInstance.aliveGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**string**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | server system is allive |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

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

let xPerformative: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.getAppSettings(
    xPerformative
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **xPerformative** | [**string**] |  | (optional) defaults to undefined|


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

# **setAppSettings**
> Message setAppSettings()

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

**Message**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully subbmited settings |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **versionGet**
> SoftwareComponentList versionGet()


### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

let type: SoftwareComponentType; // (optional) (default to undefined)
let filter: string; // (optional) (default to undefined)
let isShowSource: boolean; // (optional) (default to undefined)

const { status, data } = await apiInstance.versionGet(
    type,
    filter,
    isShowSource
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **type** | **SoftwareComponentType** |  | (optional) defaults to undefined|
| **filter** | [**string**] |  | (optional) defaults to undefined|
| **isShowSource** | [**boolean**] |  | (optional) defaults to undefined|


### Return type

**SoftwareComponentList**

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

