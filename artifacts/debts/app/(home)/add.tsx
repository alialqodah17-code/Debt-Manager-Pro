// Placeholder route — the tab button navigates to /new instead.
// This file exists so the Tabs navigator can render the centered + button.
import { Redirect } from "expo-router";
export default function AddTab() {
  return <Redirect href="/(home)/new" />;
}
