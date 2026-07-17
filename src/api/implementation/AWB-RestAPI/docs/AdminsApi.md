# AdminsApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**downloadAppSettingsFile**](#downloadappsettingsfile) | **GET** /app/settings/download | Download configuration file|
|[**infoGet**](#infoget) | **GET** /info | Returns system information|
|[**loadGet**](#loadget) | **GET** /load | Returns the current System load|
|[**uploadAppSettingsFile**](#uploadappsettingsfile) | **POST** /app/settings/upload | Upload configuration file (binary)|

# **downloadAppSettingsFile**
> File downloadAppSettingsFile()


### Example

```typescript
import {
    AdminsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminsApi(configuration);

let xPerformative: string; //Defines which configuration should be downloaded (optional) (default to undefined)

const { status, data } = await apiInstance.downloadAppSettingsFile(
    xPerformative
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **xPerformative** | [**string**] | Defines which configuration should be downloaded | (optional) defaults to undefined|


### Return type

**File**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | File download successful |  * Content-Disposition - attachment; filename&#x3D;\&quot;config.json\&quot; <br>  |

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

# **uploadAppSettingsFile**
> Message uploadAppSettingsFile()

Allows uploading configuration files via multipart/form-data. The X-Performative header defines the type of configuration file.

### Example

```typescript
import {
    AdminsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminsApi(configuration);

let file: File; //The configuration file to upload (default to undefined)
let xPerformative: string; //Defines which configuration should be updated (optional) (default to undefined)

const { status, data } = await apiInstance.uploadAppSettingsFile(
    file,
    xPerformative
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **file** | [**File**] | The configuration file to upload | defaults to undefined|
| **xPerformative** | [**string**] | Defines which configuration should be updated | (optional) defaults to undefined|


### Return type

**Message**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Upload successful and configuration applied |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

