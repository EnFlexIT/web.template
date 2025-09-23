# DoActionApi

All URIs are relative to *https://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**doRestartPost**](#dorestartpost) | **POST** /doRestart | |
|[**doUpdatePost**](#doupdatepost) | **POST** /doUpdate | |

# **doRestartPost**
> doRestartPost()

tries to shedule restart

### Example

```typescript
import {
    DoActionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DoActionApi(configuration);

const { status, data } = await apiInstance.doRestartPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**423** | Restart could not be initiated |  -  |
|**200** | Restart will happen. History can be accessed via eventLog |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **doUpdatePost**
> doUpdatePost()

tries to initiate update of awb

### Example

```typescript
import {
    DoActionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DoActionApi(configuration);

const { status, data } = await apiInstance.doUpdatePost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**423** | AWB cant currently be updated due to unknown circumstances |  -  |
|**200** | AWB Update was sheduled. The state of the update can be received by calling /eventLog |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

