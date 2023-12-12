import "./app.css";
import App from "./components/Chat.svelte";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
