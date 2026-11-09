import { createFileRoute } from '@tanstack/react-router';
import { BodyModel3DSpikePage } from '@src/features/painJournal/presentation/BodyModel3DSpikePage';
export const Route = createFileRoute('/spike/body-3d')({ component: BodyModel3DSpikePage });
