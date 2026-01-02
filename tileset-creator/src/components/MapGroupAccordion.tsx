import { Accordion } from "react-bootstrap";
import type { ReactNode } from "react";

type Props = {
  eventKey: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function MapGroupAccordion({
  eventKey,
  title,
  children,
  className = "",
  headerClassName = "",
}: Props) {
  return (
    <Accordion className={className} alwaysOpen defaultActiveKey={[eventKey]}>
      <Accordion.Item eventKey={eventKey}>
        <Accordion.Header className={headerClassName}>{title}</Accordion.Header>
        <Accordion.Body className="p-0 pt-2">{children}</Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

export default MapGroupAccordion;
