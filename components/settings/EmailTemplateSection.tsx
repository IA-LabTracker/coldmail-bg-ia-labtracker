import { Control } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { SectionHeader } from "@/components/settings/SectionHeader";
import { SettingsFormValues } from "@/hooks/useSettings";

const TEMPLATE_VARIABLES = ["{{company}}", "{{email}}", "{{region}}", "{{industry}}"];

interface EmailTemplateSectionProps {
  control: Control<SettingsFormValues>;
  onInsertVariable: (variable: string) => void;
}

export function EmailTemplateSection({ control, onInsertVariable }: EmailTemplateSectionProps) {
  return (
    <section>
      <SectionHeader title="Email Template" />
      <div className="mt-4 rounded-lg border bg-card p-5">
        <FormField
          control={control}
          name="emailTemplate"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={`Hi {{company}},\n\nI noticed you're in the {{industry}} space...`}
                  className="min-h-40 resize-y"
                  {...field}
                />
              </FormControl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onInsertVariable(v)}
                    className="rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
