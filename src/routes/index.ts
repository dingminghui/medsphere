import { GraphDetail } from "@/pages/GraphDetail";
import { GraphList } from "@/pages/GraphList";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: GraphList,
  },
  {
    path: "/graph/:id",
    Component: GraphDetail,
  },
]);
