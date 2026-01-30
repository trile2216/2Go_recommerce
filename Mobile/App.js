import { StyleSheet, Text, View } from 'react-native';
import RootNavigation from './src/navigation/RootNavigation';
import AppProvider from './src/provider/AppProvider';
import StorageProvider from './src/provider/StorageProvider';

export default function App() {
  return (
    <AppProvider>
      <StorageProvider>
        <RootNavigation />
      </StorageProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
