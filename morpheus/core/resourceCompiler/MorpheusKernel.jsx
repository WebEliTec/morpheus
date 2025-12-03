import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import _ from 'lodash';
import axios from "axios";

export default class MorpheusKernel {

  constructor() {

    if (typeof this.init === 'function') {
      this.init();
    }

  }

  /* Constants, Meta Data, Core Data & Props
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getConstant( constantId ) {
    const constant = this.constants?.[constantId];

    if( !constant ) {
      console.warn(`[Kernel] Unknown constant id: "${constantId}"`);
      return null;
    }

    return constant;

  }

  /* Core Data Management
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getCoreData( coreDataItemId ) {
    return this.getCoreDataItem( coreDataItemId );
  }

  getCoreDataItem(coreDataItemId) {

    const coreDataItem = this.coreData[ coreDataItemId ];

    if (!coreDataItem) {
      console.warn(`[Kernel] Unknown core data item id: "${coreDataItemId}"`);
      return () => <div>Missing Core Data: ${coreDataItemId}</div>;
    }

    return coreDataItem;

  }

  /* Meta Data Management
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getMetaData() {
    return this.metaData;
  }

  getMetaDataItem( metaDataItemId ) {

    const metaDataItem = this.metaData[metaDataItemId];

    if (!metaDataItem) {
      console.warn(`[Kernel] Unknown meta data item id: "${metaDataItemId}"`);
      return () => <div>Missing Meta Data: ${metaDataItemId}</div>;
    }

    return metaDataItem;

  }

  /* Runtime Data Management
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getRuntimeData() {
    return this.runtimeData;
  }

  getRuntimeDataItem( runtimeDataItemId ) {

    const runtimeDataItem = this.runtimeData[metaDataItemId];

    if (!runtimeDataItem) {
      console.warn(`[Kernel] Unknown runtime data item id: "${runtimeDataItemId}"`);
      return () => <div>Missing Meta Data: ${runtimeDataItemId}</div>;
    }

    return runtimeDataItem;

  }

  setRuntimeDataItem( runtimeDataId, value ) {
    console.log(runtimeDataId, value);
    this.onRuntimeDataChange();
    this.runtimeData[runtimeDataId] = value;
  }


  /* React Convenience Functions
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  useState( defaultValue = null ) {
    return useState( defaultValue );
  }

  useEffect( fn, deps = null ) {
    return useEffect( fn, deps );
  }

  useRef( defaultValue ) {
    return useEffect( defaultValue );
  }

  onMount( fn ) {
    return this.useEffect( fn, [] );
  }

  /* Libraries & Vendors
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getNanoId() {
    return nanoid();
  }

  lodash() {
    return _;
  }

  axios() {
    return axios;
  }

  /* Signal Management
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getAllSignalItems () {
    return Object.entries(this.signals).reduce((acc, [id, signal]) => {
      acc[id] = {
        id: signal.id,
        type: signal.type,
        value: signal.value,
      };
      return acc;
    }, {});
  }
  
  getSignalItem (signalId) {
    const signal = this.signals?.[signalId];
    if (!signal) {
      console.warn(`[Kernel] Unknown signal ID: "${signalId}"`);
      return null;
    }
    return signal;
  }

  getSignal( signalId, key = null ) {
    return this.getSignalValue( signalId, key = null );
  }
  
  getSignalValue (signalId, key = null) {
    const signal = this.getSignalItem(signalId);
    if (!signal) {
      return undefined;
    } 
  
    if (signal.type === "primitive") {
      return signal.value;
    }
  
    if (signal.type === "object") {
      if (key == null) {
        return signal.value;
      }
      return signal.value?.[key];
    }
  
    console.warn(`[Kernel] Unknown signal type for "${signalId}"`);
    return undefined;
  }

  setSignal( signalId, keyOrValue, valueIfObject = null ) {
    this.setSignalValue (signalId, keyOrValue, valueIfObject = null);
  }
  
  setSignalValue (signalId, keyOrValue, valueIfObject = null) {
    const signal = this.getSignalItem(signalId);
    if (!signal) return;
  
    if (signal.type === "primitive") {
      this.updateSignalValue(signal.set, keyOrValue);
    } else if (signal.type === "object") {
      if (typeof keyOrValue === 'object' && keyOrValue !== null && valueIfObject === null) {
        signal.set(keyOrValue);
      } else {
        this.updateSignalObject(signal.set, keyOrValue, valueIfObject);
      }
    } else {
      console.warn(`[Kernel] Unknown signal type for "${signalId}"`);
    }

    this._updateOptimisticSignal(signalId, keyOrValue, valueIfObject);
  }
  
  mergeSignal (signalId, updates = {}) {
    const signal = this.getSignalItem(signalId);
    if (signal?.type !== "object") {
      console.warn(`[Kernel] Cannot merge — signal "${signalId}" is not object type`);
      return;
    }

    this.mergeSignalObject(signal.set, updates);
    this._mergeOptimisticSignalObject(signalId, updates);
  }
  
  updateSignal (signalId, updaterFn) {
    const signal = this.getSignalItem(signalId);
    if (!signal) return;
    signal.set(updaterFn);
  }
  
  updateSignalValue (signalSetter, value) {
    signalSetter(value);
  }
  
  updateSignalObject (signalSetter, key, value) {
    signalSetter(prev => ({
      ...prev,
      [key]: value
    }));
  }

  mergeSignalObject (signalSetter, updates = {}) {
    signalSetter(prev => ({
      ...prev,
      ...updates
    }));
  }

  toggleSignal(signalId, key = null) {
    this.toggleSignalValue(signalId, key = null);
  }

  toggleSignalValue(signalId, key = null) {
    const signal = this.getSignalItem(signalId);
    if (!signal) return;
  
    if (signal.type === "primitive") {
      const current = signal.value;
      if (typeof current !== "boolean") {
        console.warn(`[Kernel] Cannot toggle — signal "${signalId}" is not boolean`);
        return;
      }
  
      signal.set(!current);
      this._toggleOptimisticSignalValue(signalId);
    } 
    else if (signal.type === "object") {
      if (key === null) {
        console.warn(`[Kernel] Missing key for object signal toggle: "${signalId}"`);
        return;
      }
  
      signal.set(prev => ({
        ...prev,
        [key]: !prev?.[key]
      }));
      
      this._toggleOptimisticSignalObjectValue(signalId, key);
    } 
    else {
      console.warn(`[Kernel] Cannot toggle — unknown signal type for "${signalId}"`);
    }
  }

  resetSignal (signalId) {
    const signal = this.getSignalItem(signalId);
    if (!signal) return;

    if (signal.type === "primitive") {
      signal.set(undefined);
    } else if (signal.type === "object") {
      signal.set({});
    } else {
      console.warn(`[Kernel] Cannot reset — unknown signal type for "${signalId}"`);
    }

    this._resetOptimisticSignal(signalId);
  }

  /* Optimistic Signal Management
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  _createOptimisticSignalsCopy(signals) {
    const optimisticCopy = {};
    
    Object.entries(signals).forEach(([key, signal]) => {
      optimisticCopy[key] = {
        ...signal,
        value: cloneDeep(signal.value)
      };
    });
    
    return optimisticCopy;
  }

  getOptimisticSignalData(signalId) {
    const signal = this.optimisticSignals?.[signalId];
    if (!signal) {
      console.warn(`[Kernel] Unknown signal ID in optimistic signals: "${signalId}"`);
      return null;
    }
    return signal;
  }

  getOptimisticSignalValue(signalId, key = null) {
    const signal = this.getOptimisticSignalData(signalId);
    if (!signal) return undefined;

    if (signal.type === "primitive") {
      return signal.value;
    }

    if (signal.type === "object") {
      if (key == null) {
        return signal.value;
      }
      return signal.value?.[key];
    }

    console.warn(`[Kernel] Unknown signal type for "${signalId}" in optimistic signals`);
    return undefined;
  }

  _updateOptimisticSignal(signalId, keyOrValue, valueIfObject = null) {
    const optimisticSignal = this.optimisticSignals[signalId];
    if (!optimisticSignal) return;

    if (optimisticSignal.type === "primitive") {
      optimisticSignal.value = keyOrValue;
    } else if (optimisticSignal.type === "object") {
      if (typeof keyOrValue === 'object' && keyOrValue !== null && valueIfObject === null) {
        optimisticSignal.value = cloneDeep(keyOrValue);
      } else {
        optimisticSignal.value = {
          ...optimisticSignal.value,
          [keyOrValue]: valueIfObject
        };
      }
    }
  }

  _mergeOptimisticSignalObject(signalId, updates = {}) {
    const optimisticSignal = this.optimisticSignals[signalId];
    if (!optimisticSignal || optimisticSignal.type !== "object") return;
    
    optimisticSignal.value = {
      ...optimisticSignal.value,
      ...cloneDeep(updates)
    };
  }

  _toggleOptimisticSignalValue(signalId) {
    const optimisticSignal = this.optimisticSignals[signalId];
    if (!optimisticSignal || optimisticSignal.type !== "primitive") return;
    
    optimisticSignal.value = !optimisticSignal.value;
  }

  _toggleOptimisticSignalObjectValue(signalId, key) {
    const optimisticSignal = this.optimisticSignals[signalId];
    if (!optimisticSignal || optimisticSignal.type !== "object") return;
    
    optimisticSignal.value = {
      ...optimisticSignal.value,
      [key]: !optimisticSignal.value?.[key]
    };
  }

  _resetOptimisticSignal(signalId) {
    const optimisticSignal = this.optimisticSignals[signalId];
    if (!optimisticSignal) return;
    
    if (optimisticSignal.type === "primitive") {
      optimisticSignal.value = undefined;
    } else if (optimisticSignal.type === "object") {
      optimisticSignal.value = {};
    }
  }

  getAllOptimisticSignals() {
    return Object.entries(this.optimisticSignals).reduce((acc, [id, signal]) => {
      acc[id] = {
        id: signal.id,
        type: signal.type,
        value: signal.value,
      };
      return acc;
    }, {});
  }

  syncOptimisticSignals() {
    Object.keys(this.signals).forEach(signalId => {
      const actualSignal = this.signals[signalId];
      const optimisticSignal = this.optimisticSignals[signalId];
      
      if (actualSignal && optimisticSignal) {
        optimisticSignal.value = cloneDeep(actualSignal.value);
      }
    });
  }



  overwriteSignalValue(signalId, newValue) {
    const signal = this.getSignalItem(signalId);
    if (!signal) return;

    if (signal.type === "primitive") {
      signal.set(newValue);
    } else if (signal.type === "object") {
      // For objects, we need to create a new object to trigger React's re-render
      // This ensures React sees it as a new reference
      const clonedValue = typeof newValue === 'object' && newValue !== null 
        ? { ...newValue } 
        : newValue;
      signal.set(clonedValue);
    } else {
      console.warn(`[Kernel] Unknown signal type for "${signalId}"`);
      return;
    }
    
    // Update optimistic signal as well
    this._overwriteOptimisticSignalValue(signalId, newValue);
  }

  // Add this to the Optimistic Signal Management section:
  _overwriteOptimisticSignalValue(signalId, newValue) {
    const optimisticSignal = this.optimisticSignals[signalId];
    if (!optimisticSignal) return;
    
    // Deep clone for optimistic signals to prevent reference issues
    optimisticSignal.value = cloneDeep(newValue);
  }

}