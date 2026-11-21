import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "./Panel";

const meta = {
  component: Panel,
  title: "Layout/Panel",
  args: { title: "Execution Trend", children: "Chart or table content" },
} satisfies Meta<typeof Panel>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
