/**
 * This file defines the default layout for data that is present during runtime
 * The application does not make use of all of the functions needed to define an objet as Data<D>
 * 	but rather this type defintion should be used as a reference for what should be implemented.
 */
import { AsyncThunk, AsyncThunkConfig, Slice } from "@reduxjs/toolkit";

export interface Data<D> {
  /** stringifies given data */
  stringifyData(data: D): string;
  /** parses stringified input. can fail */
  parseData(data: string): D | null;
  /** read stringified data from somewhere. can fail */
  readData(): Promise<string | null>;
  /** write stringified data to somewhere */
  writeData(data: string): void;
  /** slice to integrate with redux */
  slice: Slice<D>;
  /** initialization of redux state. ideally the reducer implements an extraBuilder that listens for initializeState.fulfilled */
  initializeState: AsyncThunk<D, void, AsyncThunkConfig>;
  /** initial State. this value should be used for redux initial state and when initializeState fails */
  initialState: D;
  /** identifies the data */
  id: string;
  /** which other data objects this one depends on */
  dependencies: string[];
}
