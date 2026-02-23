# UserApi

All URIs are relative to *https://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**changePassword**](#changepassword) | **POST** /user/pswd-change | Changes the user password|
|[**loginUser**](#loginuser) | **GET** /user/login | Returns (renews) the current bearer token|
|[**logout**](#logout) | **GET** /user/logout | Logs out the user from the system|

# **changePassword**
> changePassword()



### Example

```typescript
import {
    UserApi,
    Configuration,
    PasswordChange
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let passwordChange: PasswordChange; //The credentials to login. (optional)

const { status, data } = await apiInstance.changePassword(
    passwordChange
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **passwordChange** | **PasswordChange**| The credentials to login. | |


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | successfully change password |  -  |
|**0** | invalid parameters supplied |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **loginUser**
> string loginUser()

Returns \"Bearer <token>\" if the current authentication is valid.

### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

const { status, data } = await apiInstance.loginUser();
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
|**200** | successfully logged-in / token renewed |  -  |
|**401** | Unauthorized |  -  |
|**0** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logout**
> logout()

Effectively logs-out the user from the System 

### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

const { status, data } = await apiInstance.logout();
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
|**200** | successfully logged the user out |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

