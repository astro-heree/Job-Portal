import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" {...props} />;
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-8 5h10a2 2 0 0 0 2-2V7.828a2 2 0 0 0-.586-1.414l-3.828-3.828A2 2 0 0 0 13.172 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
    </Icon>
  );
}

export function PaperAirplaneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 4.5 15 7.5-15 7.5 3-7.5-3-7.5Z" />
    </Icon>
  );
}

export function StarBadgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.5 2.02 4.09 4.52.66-3.27 3.19.77 4.5-4.04-2.13-4.04 2.13.77-4.5-3.27-3.19 4.52-.66L11.48 3.5Z" />
    </Icon>
  );
}

export function EnvelopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25v9a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 17.25v-9M3 8.25 12 14l9-5.75M3 8.25A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25" />
    </Icon>
  );
}

export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.1a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-4.15M3.75 14.15V9.5a2 2 0 0 1 2-2h12.5a2 2 0 0 1 2 2v4.65M3.75 14.15c1.82.63 4.03 1.1 6.25 1.29m10.25-1.29c-1.82.63-4.03 1.1-6.25 1.29m0 0v-1.19a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1.19m4 0c-1.32.11-2.66.11-4 0M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
    </Icon>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.4 9.4 0 0 0 2.625.372 9.3 9.3 0 0 0 4-.72c-.045-2.354-1.849-4.28-4.146-4.649M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.3 12.3 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </Icon>
  );
}

export function CheckBadgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 2.25 2.25 4.5-4.5m4.5 2.25a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </Icon>
  );
}
