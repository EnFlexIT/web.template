# AdminsApi

All URIs are relative to *https://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**executionStateGet**](#executionstateget) | **GET** /executionState | Returns the current AWB state|
|[**infoGet**](#infoget) | **GET** /info | Returns system information|
|[**loadGet**](#loadget) | **GET** /load | Returns the current System load|

# **executionStateGet**
> ExecutionState executionStateGet()

Returns the current state of Agent.Workbench consisiting information  about the execution mode, the currently open project and other. 

### Example

```typescript
import {
    AdminsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminsApi(configuration);

const { status, data } = await apiInstance.executionStateGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**ExecutionState**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | AWB-State |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **infoGet**
> SystemInformation infoGet()

Returns Hardware and system  information. 

### Example

```typescript
import {
    AdminsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminsApi(configuration);

const { status, data } = await apiInstance.infoGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SystemInformation**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | AWB-State |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **loadGet**
> SystemLoad loadGet()

Returns the current system load measured by Agent.Workbench that includes CPU-, memory- and Java Heap - load. Further, the number of threads and agents will be returnes 

### Example

```typescript
import {
    AdminsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminsApi(configuration);

const { status, data } = await apiInstance.loadGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SystemLoad**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | System Load |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

