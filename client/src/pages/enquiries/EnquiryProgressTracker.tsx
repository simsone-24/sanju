import { StageProgressTracker } from '../../components/StageProgressTracker';
import type { EnquiryStatus } from '../../types/enquiry';
import { ENQUIRY_STAGES, enquiryStageIndex } from './enquiryStatusTransitions';

// Where this enquiry sits on the documented Enquiry → Appointment → Quotation → Order path, drawn
// by the same tracker the Orders module uses so both detail pages read alike. A lost enquiry never
// entered a further stage, so it gets the halted banner instead of a highlighted step.
//
// No dates: unlike an order, an enquiry's stage changes aren't recorded with the stage they moved
// it to, so the tracker shows labels only rather than a row of dashes.
export function EnquiryProgressTracker({ status }: { status: EnquiryStatus }) {
  if (status === 'ORDER_LOST') {
    return (
      <StageProgressTracker
        stages={[]}
        currentIndex={-1}
        halted={{
          title: 'Order Lost',
          description: 'This enquiry is closed and no longer progressing towards an order.',
        }}
      />
    );
  }

  return <StageProgressTracker stages={ENQUIRY_STAGES} currentIndex={enquiryStageIndex(status)} />;
}
