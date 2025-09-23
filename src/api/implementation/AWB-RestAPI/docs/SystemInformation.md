# SystemInformation

The system information consisting of Hardware and OS information

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**osDescription** | **string** |  | [default to undefined]
**osManufacturer** | **string** |  | [default to undefined]
**osFamilly** | **string** |  | [default to undefined]
**osVersion** | **string** |  | [default to undefined]
**processorName** | **string** |  | [default to undefined]
**processorFrequenceInMhz** | **number** |  | [default to undefined]
**processorNoPhysical** | **number** |  | [default to undefined]
**processorNoLogical** | **number** |  | [default to undefined]
**memoryTotalInGB** | **number** |  | [default to undefined]
**swapMemoryTotalInGB** | **number** |  | [default to undefined]
**heapMemoryMaxInGB** | **number** |  | [default to undefined]
**networkConnections** | [**Array&lt;NetworkConnection&gt;**](NetworkConnection.md) |  | [default to undefined]

## Example

```typescript
import { SystemInformation } from './api';

const instance: SystemInformation = {
    osDescription,
    osManufacturer,
    osFamilly,
    osVersion,
    processorName,
    processorFrequenceInMhz,
    processorNoPhysical,
    processorNoLogical,
    memoryTotalInGB,
    swapMemoryTotalInGB,
    heapMemoryMaxInGB,
    networkConnections,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
