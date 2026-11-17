# DefaultApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**assignContentToMenu**](#assigncontenttomenu) | **PUT** /menu/{menuId}/contentElement/{elementId} | Assign content to a menu|
|[**createContentElement**](#createcontentelement) | **POST** /contentElement | Create a content element|
|[**createMenu**](#createmenu) | **POST** /menu | Create a new menu|
|[**deleteContentElement**](#deletecontentelement) | **DELETE** /contentElement/{elementId} | Delete a content element|
|[**deleteMenu**](#deletemenu) | **DELETE** /menu/{menuId} | Delete a menu|
|[**getContentElement**](#getcontentelement) | **GET** /contentElement/{elementId} | Get a content element|
|[**getMenuContent**](#getmenucontent) | **GET** /content/{menuId} | Get menu content|
|[**getMenus**](#getmenus) | **GET** /menu | Get available menu structure|
|[**removeAssignment**](#removeassignment) | **DELETE** /menu/{menuId}/contentElement/{elementId} | Remove content assignment|
|[**updateAssignmentAndPosition**](#updateassignmentandposition) | **PUT** /menu/contentElement/assignment | Update assignment and position|
|[**updateContentElement**](#updatecontentelement) | **PUT** /contentElement/{elementId} | Update a content element|
|[**updateMenu**](#updatemenu) | **PUT** /menu/{menuId} | Update a menu|
|[**updateMenuPermissions**](#updatemenupermissions) | **PUT** /menu/{menuId}/permissions | Set menu access roles|

# **assignContentToMenu**
> assignContentToMenu(assignContentToMenuRequest)

Adds an existing content element to the specified menu.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    AssignContentToMenuRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let menuId: number; //The unique Id of the menu (default to undefined)
let elementId: number; //The unique Id of the content element (default to undefined)
let assignContentToMenuRequest: AssignContentToMenuRequest; //

const { status, data } = await apiInstance.assignContentToMenu(
    menuId,
    elementId,
    assignContentToMenuRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **assignContentToMenuRequest** | **AssignContentToMenuRequest**|  | |
| **menuId** | [**number**] | The unique Id of the menu | defaults to undefined|
| **elementId** | [**number**] | The unique Id of the content element | defaults to undefined|


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
|**200** | Content element was added to the menu |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createContentElement**
> CreateContentElement201Response createContentElement(createContentRequest)

Creates a new content element in the system.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    CreateContentRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let createContentRequest: CreateContentRequest; //

const { status, data } = await apiInstance.createContentElement(
    createContentRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createContentRequest** | **CreateContentRequest**|  | |


### Return type

**CreateContentElement201Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Content created |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createMenu**
> CreateMenu201Response createMenu(createMenuRequest)

Creates a new menu and persists it in the database

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    CreateMenuRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let createMenuRequest: CreateMenuRequest; //

const { status, data } = await apiInstance.createMenu(
    createMenuRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createMenuRequest** | **CreateMenuRequest**|  | |


### Return type

**CreateMenu201Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Menu created |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteContentElement**
> deleteContentElement()

Removes the content element from the database and detaches it from all associated menus.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let elementId: number; //The unique Id of the content element to delete (default to undefined)

const { status, data } = await apiInstance.deleteContentElement(
    elementId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **elementId** | [**number**] | The unique Id of the content element to delete | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The content element was deleted |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteMenu**
> deleteMenu()

Removes the menu, its submenus, and all associated menu-content assignments from the database. Orphaned content will be deleted.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let menuId: number; //The unique Id of the menu to be deleted (default to undefined)

const { status, data } = await apiInstance.deleteMenu(
    menuId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **menuId** | [**number**] | The unique Id of the menu to be deleted | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The menu was deleted |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getContentElement**
> AbstractSiteContent getContentElement()

Returns a single content element corresponding to the specified ID.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let elementId: number; //unique Id of the content element (default to undefined)

const { status, data } = await apiInstance.getContentElement(
    elementId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **elementId** | [**number**] | unique Id of the content element | defaults to undefined|


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
|**200** | A single content element |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getMenuContent**
> SiteContentList getMenuContent()

Returns the list of content elements associated with the specified menu ID.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let menuId: number; //numeric Id of the content (default to undefined)

const { status, data } = await apiInstance.getMenuContent(
    menuId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **menuId** | [**number**] | numeric Id of the content | defaults to undefined|


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
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getMenus**
> MenuList getMenus()

Returns the menu structure available for the current user, optionally filtered by a specific role.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let lang: string; //the language locale to use (optional) (default to undefined)
let forRole: string; //Optional parameter to only receive menus associated to that role (optional) (default to undefined)

const { status, data } = await apiInstance.getMenus(
    lang,
    forRole
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **lang** | [**string**] | the language locale to use | (optional) defaults to undefined|
| **forRole** | [**string**] | Optional parameter to only receive menus associated to that role | (optional) defaults to undefined|


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
|**200** | The menus to be seen by the current user |  -  |
|**401** | Unauthorized |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeAssignment**
> removeAssignment()

Removes the assignment between the specified content element and menu. If this was the element\'s last menu assignment, the content element itself is automatically deleted, and subsequent items shift to fill the gap.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let menuId: number; //The unique Id of the menu (default to undefined)
let elementId: number; //The unique Id of the content element (default to undefined)

const { status, data } = await apiInstance.removeAssignment(
    menuId,
    elementId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **menuId** | [**number**] | The unique Id of the menu | defaults to undefined|
| **elementId** | [**number**] | The unique Id of the content element | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The assignment was removed |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateAssignmentAndPosition**
> updateAssignmentAndPosition(updateContentAssignmentRequest)

Reorders a content element within the same menu or moves it to a target menu at a specified position.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    UpdateContentAssignmentRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let updateContentAssignmentRequest: UpdateContentAssignmentRequest; //

const { status, data } = await apiInstance.updateAssignmentAndPosition(
    updateContentAssignmentRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateContentAssignmentRequest** | **UpdateContentAssignmentRequest**|  | |


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
|**200** | Assignment and position updated successfully |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateContentElement**
> updateContentElement(updateContentElementRequest)

Updates the properties of the specified content element.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    UpdateContentElementRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let elementId: number; //The unique Id of the content element to update (default to undefined)
let updateContentElementRequest: UpdateContentElementRequest; //

const { status, data } = await apiInstance.updateContentElement(
    elementId,
    updateContentElementRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateContentElementRequest** | **UpdateContentElementRequest**|  | |
| **elementId** | [**number**] | The unique Id of the content element to update | defaults to undefined|


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
|**200** | The element was updated! |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateMenu**
> updateMenu(menuItem)

Updates the properties of the specified menu.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    MenuItem
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let menuId: number; //The unique Id of the menu to be updated (default to undefined)
let menuItem: MenuItem; //

const { status, data } = await apiInstance.updateMenu(
    menuId,
    menuItem
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **menuItem** | **MenuItem**|  | |
| **menuId** | [**number**] | The unique Id of the menu to be updated | defaults to undefined|


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
|**200** | The menu was updated! |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateMenuPermissions**
> updateMenuPermissions(requestBody)

Sets the allowed access roles for the specified menu.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let menuId: number; //The unique Id of the menu (default to undefined)
let requestBody: Array<string>; //

const { status, data } = await apiInstance.updateMenuPermissions(
    menuId,
    requestBody
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **requestBody** | **Array<string>**|  | |
| **menuId** | [**number**] | The unique Id of the menu | defaults to undefined|


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
|**200** | The right was set |  -  |
|**400** | Invalid request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**503** | Service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

