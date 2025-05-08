import React from "react";
import { DialogHeader } from "./ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
interface Props {
  title?: string;
  subTitle?: string;
  icon?: LucideIcon;

  iconClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}
function CustomDialogHeader(props: Props) {
  return (
    <DialogHeader className="py-6">
      <DialogTitle asChild>
        <div className="flex flex-col items-center gap-2 mb-2">
          {props.icon && (
            <props.icon
              size={30}
              className={cn("stroke-primary", props.iconClassName)}
            />
          )}
          {props.title && (
            <p className={cn("text-xl text-primary", props.titleClassName)}>
              {props.title}
            </p>
          )}
          {props.subTitle && (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                props.subtitleClassName
              )}
            >
              {props.subTitle}
            </p>
          )}
        </div>
      </DialogTitle>
      <Separator />
    </DialogHeader>
  );
}

export default CustomDialogHeader;
