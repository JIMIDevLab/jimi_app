import { Redirect } from 'expo-router';

// Mirrors `initialRoute = '/home'` from lib/my_app.dart.
export default function Index() {
  return <Redirect href="/home" />;
}
