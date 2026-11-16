# UpdateContentAssignmentRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**elementId** | **number** | Unique Id of the content element to be moved/reordered | [default to undefined]
**sourceMenuId** | **number** | Unique Id of the menu from which the content element is currently assigned | [default to undefined]
**targetMenuId** | **number** | Unique Id of the menu into which the content element should be assigned | [default to undefined]
**position** | **number** | The new one-based target position within the target menu | [default to undefined]

## Example

```typescript
import { UpdateContentAssignmentRequest } from './api';

const instance: UpdateContentAssignmentRequest = {
    elementId,
    sourceMenuId,
    targetMenuId,
    position,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
