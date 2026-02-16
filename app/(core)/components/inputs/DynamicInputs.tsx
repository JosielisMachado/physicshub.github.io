import NumberInput from "./NumberInput.jsx";
import CheckboxInput from "./CheckboxInput.jsx";
import ColorInput from "./ColorInput.jsx";
import SelectInput from "./SelectInput.jsx";

// 1. Define the specific shapes for your configuration
interface FieldConfig {
  name: string;
  label: string;
  type: "number" | "checkbox" | "color" | "select";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
}

interface Props {
  config: FieldConfig[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
}

export default function DynamicInputs({ config, values, onChange }: Props) {
  return (
    <div className="inputs-container">
      {config.map((field) => {
        const commonProps = {
          name: field.name,
          label: field.label,
        };

        if (field.type === "number") {
          return (
            <NumberInput
              key={field.name}
              {...commonProps}
              val={values[field.name]}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange(field.name, Number(e.target.value))
              }
            />
          );
        }

        if (field.type === "checkbox") {
          return (
            <CheckboxInput
              key={field.name}
              {...commonProps}
              checked={!!values[field.name]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange(field.name, e.target.checked)
              }
            />
          );
        }

        if (field.type === "color") {
          return (
            <ColorInput
              key={field.name}
              {...commonProps}
              value={values[field.name]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange(field.name, e.target.value)
              }
            />
          );
        }

        if (field.type === "select") {
          return (
            <SelectInput
              key={field.name}
              {...commonProps}
              options={field.options || []}
              value={values[field.name]}
              placeholder={field.placeholder}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange(field.name, e.target.value)
              }
            />
          );
        }
        return null;
      })}
    </div>
  );
}
