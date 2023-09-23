import { Link } from '@chakra-ui/layout';
import { AlertStatus } from '@chakra-ui/react';
import { ToastPosition, useToast } from '@chakra-ui/toast';
import { usePublicClient } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';
import { getEtherscanUrl } from '@/utils/networks';

const toastDefaultArgs = {
  position: 'bottom-right' as ToastPosition,
  isClosable: true,
};

const useNotifications = () => {
  const provider = usePublicClient();
  const toast = useToast();

  const notifyUser = ({
    title,
    alertType,
    message,
    id,
  }: {
    alertType: AlertStatus;
    message: string;
    title?: string;
    id?: string;
  }) => {
    if (id && toast.isActive(id)) {
      return;
    }
    toast({
      ...toastDefaultArgs,
      id,
      description: message,
      title,
      status: alertType,
    });
  };

  // TODO: Based on the umbra implementation of BNC and untested
  const txNotify = async (txHash: string) => {
    const chainId = await provider.getChainId();
    const href = getEtherscanUrl(txHash, chainId);
    const toastId = toast({
      ...toastDefaultArgs,
      isClosable: false,
      description: (
        <Link href={href} isExternal>
          Transaction Pending
        </Link>
      ),

      duration: null,
      status: 'loading',
    });

    const { status } = await waitForTransaction({ hash: txHash as `0x${string}` });
    toast.update(toastId, {
      ...toastDefaultArgs,
      description: status ? (
        <Link href={href} isExternal>
          Transaction succeeded
        </Link>
      ) : (
        <Link href={href} isExternal>
          Transaction failed
        </Link>
      ),
      status: status ? 'success' : 'error',
    });
  };

  return {
    notifyUser,
    txNotify,
  };
};

export default useNotifications;
