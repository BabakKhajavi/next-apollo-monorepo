import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricCard } from "./MetricCard";

const meta = {
  component: MetricCard,
  title: "Dashboard/MetricCard",
  args: { label: "Total Workflows", value: 128, icon: "✦", tone: "violet" },
} satisfies Meta<typeof MetricCard>;
export default meta;
export const Violet: StoryObj<typeof meta> = {};
export const Success: StoryObj<typeof meta> = {
  args: { label: "Successful Executions", value: 23410, tone: "green" },
};
