import { refreshSession } from './refreshHouseholdHomeSession';
import { runAndToast } from './runAndToast';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { OwnProfileDisposition } from '../../application/householdHomePorts';
import { useDeletionRequest } from '../../application/useDeletionRequest';
import { useDeletionRequestActions } from '../../application/useDeletionRequestActions';
import { useHouseholdMembers } from '../../application/useHouseholdMembers';
import { useLeaveHousehold } from '../../application/useLeaveHousehold';
import { useOwnershipOffer } from '../../application/useOwnershipOffer';
import { useOwnershipTransferActions } from '../../application/useOwnershipTransferActions';
import { householdHomeRepository } from '../../infrastructure/householdHomeRepository';
import { householdMembersRepository } from '../../infrastructure/householdMembersRepository';
import { useMemberToast } from '../members/memberToastContext';
import type { HouseholdHomeCardProps } from './HouseholdHomeCard';

type Input = { familyName: string; scope: string; hasFamily: boolean; csrfToken: string };

type HandlerDependencies = {
  familyName: string;
  client: QueryClient;
  navigate: ReturnType<typeof useNavigate>;
  showToast: (message: string) => void;
  members: ReturnType<typeof useHouseholdMembers>;
  offer: ReturnType<typeof useOwnershipOffer>;
  deletion: ReturnType<typeof useDeletionRequest>;
  ownership: ReturnType<typeof useOwnershipTransferActions>;
  leave: ReturnType<typeof useLeaveHousehold>;
  deletionActions: ReturnType<typeof useDeletionRequestActions>;
};

function buildHandlers(deps: HandlerDependencies) {
  const { familyName, client, navigate, showToast, members, offer, deletion } = deps;
  const { ownership, leave, deletionActions } = deps;
  return {
    onRetry: () => {
      void members.reload();
      void offer.reload();
      void deletion.reload();
    },
    onSendOffer: (id: string) =>
      runAndToast(ownership.sendOffer(id), offer.reload, showToast, 'Đã gửi đề nghị trao quyền Chủ hộ'),
    onRevokeOffer: (id: string) =>
      runAndToast(ownership.revokeOffer(id), offer.reload, showToast, 'Đã thu hồi đề nghị trao quyền'),
    onDecideOffer: (id: string, accept: boolean) =>
      runAndToast(
        ownership.decideOffer(id, accept),
        async () => {
          await Promise.all([
            offer.reload(),
            members.reload(),
            accept ? refreshSession(client) : Promise.resolve(),
          ]);
        },
        showToast,
        accept ? 'Bạn đã trở thành Chủ hộ' : 'Đã từ chối đề nghị làm Chủ hộ',
      ),
    onLeave: async (disposition: OwnProfileDisposition) => {
      if ((await leave.leave(disposition)).status !== 'ok') return false;
      const current = await refreshSession(client);
      showToast(`Bạn đã rời khỏi ${familyName}`);
      await navigate({ to: current ? '/waiting' : '/login', replace: true });
      return true;
    },
    onClearLeaveError: leave.clearError,
    onRequestDeletion: async (confirmFamilyName: string) => {
      if ((await deletionActions.requestDeletion(confirmFamilyName)).status !== 'ok') return false;
      await deletion.reload();
      showToast('Đã gửi yêu cầu xoá nhà');
      return true;
    },
    onRevokeDeletion: (id: string) =>
      runAndToast(
        deletionActions.revokeDeletion(id),
        deletion.reload,
        showToast,
        'Đã thu hồi yêu cầu xoá nhà',
      ),
    onClearDeletionError: deletionActions.clearError,
  };
}

export function useHouseholdHomeController({
  familyName,
  scope,
  hasFamily,
  csrfToken,
}: Input): HouseholdHomeCardProps {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useMemberToast();
  const members = useHouseholdMembers(householdMembersRepository, scope, hasFamily);
  const isOwner = Boolean(members.query.data?.find((m) => m.isSelf)?.isOwner);
  const offer = useOwnershipOffer(householdHomeRepository, scope, hasFamily);
  const deletion = useDeletionRequest(householdHomeRepository, scope, hasFamily && isOwner);
  const ownership = useOwnershipTransferActions(householdHomeRepository, csrfToken);
  const leave = useLeaveHousehold(householdHomeRepository.leaveHousehold, csrfToken);
  const deletionActions = useDeletionRequestActions(householdHomeRepository, csrfToken);
  const errorMessage = members.query.isError
    ? members.query.error instanceof Error
      ? members.query.error.message
      : 'Chưa thể tải thông tin nhà.'
    : (offer.query.error?.message ?? deletion.query.error?.message ?? null);

  return {
    familyName,
    members: members.query.data,
    pendingOffer: offer.query.data ?? null,
    pendingDeletion: isOwner ? (deletion.query.data ?? null) : null,
    isPending: members.query.isPending,
    errorMessage,
    ownershipPending: ownership.pending,
    ownershipError: ownership.error,
    leavePending: leave.pending,
    leaveError: leave.error,
    leaveErrorCode: leave.errorCode,
    deletionPending: deletionActions.pending,
    deletionError: deletionActions.error,
    ...buildHandlers({
      familyName,
      client,
      navigate,
      showToast,
      members,
      offer,
      deletion,
      ownership,
      leave,
      deletionActions,
    }),
  };
}
