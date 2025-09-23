# SystemLoad

The systems current load, includung CPU, memoryand HEAP  usage. Further, the number of Java threads are returned.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cpuUsage** | **number** | The CPU usage in percent | [default to undefined]
**memUsage** | **number** | The memory usage in percent | [default to undefined]
**heapUsage** | **number** | The Heap usage in percen | [default to undefined]

## Example

```typescript
import { SystemLoad } from './api';

const instance: SystemLoad = {
    cpuUsage,
    memUsage,
    heapUsage,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
