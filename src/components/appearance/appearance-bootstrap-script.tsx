import {getAppearanceBootstrapSource} from "@/lib/appearance/bootstrap-source";

export function AppearanceBootstrapScript() {
  return (
    <script
      id="brp-appearance-bootstrap"
      dangerouslySetInnerHTML={{__html: getAppearanceBootstrapSource()}}
    />
  );
}
