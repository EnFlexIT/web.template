# Event

An Event that occured and can be logged

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**time** | **string** | The time at which the event happened | [default to undefined]
**typeOfEvent** | [**EventLogTypes**](EventLogTypes.md) |  | [optional] [default to undefined]
**event** | **string** | the event that has happened | [default to undefined]

## Example

```typescript
import { Event } from './api';

const instance: Event = {
    time,
    typeOfEvent,
    event,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
