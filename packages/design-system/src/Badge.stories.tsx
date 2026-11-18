import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Badge",
  component: Badge,
  args: { children: "ACTIVE" },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Neutral: Story = { args: { tone: "neutral" } };
export const Info: Story = { args: { tone: "info", children: "GENERATING" } };
export const Success: Story = { args: { tone: "success", children: "SUCCEEDED" } };
export const Warning: Story = { args: { tone: "warning", children: "PENDING_APPROVAL" } };
export const Danger: Story = { args: { tone: "danger", children: "FAILED" } };
