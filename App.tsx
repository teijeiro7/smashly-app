import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AppNavigator from './src/navigation/app-navigator';

export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}