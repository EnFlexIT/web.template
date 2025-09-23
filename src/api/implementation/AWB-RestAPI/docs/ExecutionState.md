# ExecutionState

The Agent.Workbench execution state with its open project and the selected setup

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**executionMode** | **string** | * \&#39;APPLICATION\&#39; - Runs as end user application in an desktop environment * \&#39;SERVER\&#39; - Runs as Background server-system * \&#39;SERVER_MASTER\&#39; - Runs as central \&#39;server. master\&#39; system and manages all \&#39;server.slave\&#39; systems * \&#39;SERVER_SLAVE\&#39; - Runs as central \&#39;server. slave\&#39; system and wait for start order from the \&#39;server.master\&#39; * \&#39;DEVICE_SYSTEM\&#39; - Runs as system that directly executes single agents or projects  | [optional] [default to undefined]
**deviceSystemExecutionMode** | **string** | * \&#39;SETUP\&#39; - Runs the selected setup of an AWB projekt * \&#39;AGENT\&#39; - Runs one or more agents from an AWB project  | [optional] [default to undefined]
**project** | **string** | The currently open project | [optional] [default to undefined]
**setup** | **string** | The currently open project-setup | [optional] [default to undefined]

## Example

```typescript
import { ExecutionState } from './api';

const instance: ExecutionState = {
    executionMode,
    deviceSystemExecutionMode,
    project,
    setup,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
