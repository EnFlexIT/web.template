# SoftwareComponent


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**ID** | **string** | ID of the software component as for example symbolic bundle name or feature ID | [optional] [default to undefined]
**name** | **string** | human readable bundle or feature name | [optional] [default to undefined]
**componentType** | [**SoftwareComponentType**](SoftwareComponentType.md) |  | [optional] [default to undefined]
**version** | [**Version**](Version.md) |  | [optional] [default to undefined]

## Example

```typescript
import { SoftwareComponent } from './api';

const instance: SoftwareComponent = {
    ID,
    name,
    componentType,
    version,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
