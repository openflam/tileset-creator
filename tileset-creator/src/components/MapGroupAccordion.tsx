import { Accordion, AccordionContext, useAccordionButton } from "react-bootstrap";
import { useContext } from "react";
import type { ReactNode } from "react";

type Props = {
  eventKey: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  onToggleVisibility?: () => void;
  isVisible?: boolean;
};

function CustomToggle({ children, eventKey, className }: any) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey);

  const isExpanded = Array.isArray(activeEventKey)
    ? activeEventKey.includes(eventKey)
    : activeEventKey === eventKey;

  return (
    <button
      type="button"
      className={`accordion-button ${!isExpanded ? "collapsed" : ""} ${className}`}
      onClick={decoratedOnClick}
      style={{ borderLeft: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
    >
      {children}
    </button>
  );
}

export function MapGroupAccordion({
  eventKey,
  title,
  children,
  className = "",
  headerClassName = "",
  onToggleVisibility,
  isVisible,
}: Props) {
  // If we have visibility toggle, we split the header
  if (onToggleVisibility) {
     return (
        <Accordion className={className} alwaysOpen defaultActiveKey={[eventKey]}>
          <Accordion.Item eventKey={eventKey}>
            <div className="d-flex align-items-stretch">
                <div 
                    className={`map-group-visibility-toggle ${isVisible === false ? "hidden" : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility();
                    }}
                >
                    <i className={`bi ${isVisible !== false ? "bi-eye" : "bi-eye-slash"}`}></i>
                </div>
                <div className="flex-grow-1">
                    <CustomToggle eventKey={eventKey} className={headerClassName}>
                        {title}
                    </CustomToggle>
                </div>
            </div>
            <Accordion.Body className="p-0 pt-2">{children}</Accordion.Body>
          </Accordion.Item>
        </Accordion>
     )
  }

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