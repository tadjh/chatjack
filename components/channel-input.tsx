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
import { Input } from "@/components/ui/input";
import { RenderMode } from "@/lib/canvas/renderer";
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

export function ChannelInput({
  mode,
  channel,
}: {
  mode: RenderMode;
  channel: string;
}) {
  const [open, setOpen] = useState(!channel);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channel,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    redirect(`/${mode}/${values.channel}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="game-text-shadow cursor-pointer text-lg"
        >
          {channel || "Choose Channel"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Type a Channel</DialogTitle>
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
                  <FormControl>
                    <Input placeholder="channel" {...field} />
                  </FormControl>
                  <FormDescription>
                    Input a channel you have moderator privileges to host
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
