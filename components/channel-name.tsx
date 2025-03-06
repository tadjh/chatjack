"use client";

import { useSearch } from "@/components/search-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Twitch } from "@/lib/integrations/twitch.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(1, {
    message: "Username must be at least 1 character.",
  }),
});

export function ChannelName({
  channels,
}: {
  channels: Twitch.ModeratedChannelsResponse;
}) {
  const { channel, setContext } = useSearch();
  const [open, setOpen] = useState(channel ? false : true);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: channel ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setContext("channel", values.username);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="game-text-shadow cursor-pointer text-lg hover:underline"
        >
          {channel ? channel : "Select Channel"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Channel Name</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid space-y-8"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <FormLabel>Username</FormLabel>
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
                      {channels.data.map((channel) => (
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
                    Choose a channel you have moderator privileges to host
                    ChatJack. Players in chat will be able to participate using
                    commands like !hit and !stand.
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
