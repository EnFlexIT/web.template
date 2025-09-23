# DefaultApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**contentElementElementIDGet**](#contentelementelementidget) | **GET** /contentElement/{elementID} | Will return the content element with the specified ID|
|[**contentElementPut**](#contentelementput) | **PUT** /contentElement/ | Enables to update content elements|
|[**contentMenuIDGet**](#contentmenuidget) | **GET** /content/{menuID} | Returns the content for the specified ID|
|[**contentPut**](#contentput) | **PUT** /content/ | Enables to update content|
|[**menuGet**](#menuget) | **GET** /menu/ | Enables to build-up the menu structure|

# **contentElementElementIDGet**
> AbstractSiteContent contentElementElementIDGet()

Returns the content element with the specified ID

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let elementID: number; //numeric ID of the content element (default to undefined)

const { status, data } = await apiInstance.contentElementElementIDGet(
    elementID
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **elementID** | [**number**] | numeric ID of the content element | defaults to undefined|


### Return type

**AbstractSiteContent**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | A single content element |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contentElementPut**
> contentElementPut()


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    AbstractSiteContent
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let abstractSiteContent: AbstractSiteContent; // (optional)

const { status, data } = await apiInstance.contentElementPut(
    abstractSiteContent
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **abstractSiteContent** | **AbstractSiteContent**|  | |


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The content element was updated! |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contentMenuIDGet**
> SiteContentList contentMenuIDGet()

Returns the list of content elements for the specified menu ID.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let menuID: number; //numeric ID of the content (default to undefined)

const { status, data } = await apiInstance.contentMenuIDGet(
    menuID
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **menuID** | [**number**] | numeric ID of the content | defaults to undefined|


### Return type

**SiteContentList**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of content elements |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contentPut**
> contentPut()


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    SiteContentListUpdate
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let siteContentListUpdate: SiteContentListUpdate; // (optional)

const { status, data } = await apiInstance.contentPut(
    siteContentListUpdate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **siteContentListUpdate** | **SiteContentListUpdate**|  | |


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Content was updated! |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **menuGet**
> MenuList menuGet()

Returns the menu structure available for the current user

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let lang: string; //the language locale to use (optional) (default to undefined)

const { status, data } = await apiInstance.menuGet(
    lang
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **lang** | [**string**] | the language locale to use | (optional) defaults to undefined|


### Return type

**MenuList**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | The menus to be seen by the current user |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

