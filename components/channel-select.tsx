"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RenderMode } from "@/lib/canvas/renderer";
import { ModeratedChannelsResponse } from "@/lib/integrations/twitch.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  channel: z.string().min(1, {
    message: "Username must be at least 1 character.",
  }),
});

export function ChannelSelect({
  mode,
  channel,
  options,
}: {
  mode: RenderMode;
  channel: string;
  options: ModeratedChannelsResponse;
}) {
  const [open, setOpen] = useState(!channel);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channel,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const option = options.data.find(
      (option) => option.broadcaster_login === values.channel,
    )!;

    redirect(`/${mode}/${values.channel}/${option.broadcaster_id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="game-text-shadow cursor-pointer text-lg"
        >
          {channel || "Select Channel"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Select a Channel</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid space-y-8"
          >
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <FormLabel>Channel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.data.map((channel) => (
                        <SelectItem
                          key={channel.broadcaster_id}
                          value={channel.broadcaster_login}
                        >
                          {channel.broadcaster_login}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a channel you have moderator privileges to host
                    ChatJack.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="cursor-pointer">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
