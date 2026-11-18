import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Button",
  component: Button,
  args: { children: "Execute workflow" },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Danger: Story = { args: { variant: "danger", children: "Delete" } };
export const Disabled: Story = { args: { disabled: true, children: "Running…" } };
