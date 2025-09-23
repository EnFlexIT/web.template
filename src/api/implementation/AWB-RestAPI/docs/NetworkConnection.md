# NetworkConnection

Describes a single network connection.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** |  | [default to undefined]
**displayName** | **string** |  | [default to undefined]
**macAddress** | **string** |  | [default to undefined]
**ip4Addresses** | **string** |  | [default to undefined]
**ip6Addresses** | **string** |  | [default to undefined]
**trafficSendInMB** | **number** |  | [default to undefined]
**trafficReceivedInMB** | **number** |  | [default to undefined]

## Example

```typescript
import { NetworkConnection } from './api';

const instance: NetworkConnection = {
    name,
    displayName,
    macAddress,
    ip4Addresses,
    ip6Addresses,
    trafficSendInMB,
    trafficReceivedInMB,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
