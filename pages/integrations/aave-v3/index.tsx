
import { useEffect, useState } from 'react';
import { AddIcon } from '@chakra-ui/icons';
import { Box, Card, CardBody, Flex, Heading, IconButton, Stack, Text } from '@chakra-ui/react';
import { readContracts } from 'wagmi';
import { useNFT } from '@/contexts/NFTContext';
import { shortenAddress } from '@/utils/address';
import SetupACModal from './SetupACModal';
import { abi } from './abi-typechain/abi';
import TxFrom, { Account } from './components/TxFrom';
import { CONTRACT_ADDRESS as ACM_CONTRACT_ADDRESS } from './contract/acm';

type ACMAccountListProps = {
  // eslint-disable-next-line no-unused-vars
  onClick: (account: Account) => void;
};

const ACMAccountList = ({ onClick }: ACMAccountListProps) => {
  const { nftList, hasLoaded: nftListHasLoaded } = useNFT();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!nftListHasLoaded) return;
    const fn = async () => {
      const acm = nftList.find(({ address }) => address === ACM_CONTRACT_ADDRESS);
      if (!acm) return;
      const accountIds = acm.privateSubIds;
      const contracts = (await readContracts({
        contracts: accountIds.map((accountId) => ({
          abi: abi.ACM,
          address: ACM_CONTRACT_ADDRESS,
          functionName: 'nftAc',
          args: [accountId],
        })),
      })) as string[];
      setAccounts(accountIds.map((id, i) => ({ id, contract: contracts[i] })));
    };
    fn();
  }, [nftList, nftListHasLoaded]);

  return (
    <Stack spacing="4">
      {accounts.map(({ id, contract }, i) => (
        <Card
          key={i}
          variant={'elevated'}
          cursor={'pointer'}
          onClick={() => onClick({ id, contract })}
        >
          {/* <CardHeader>
          </CardHeader> */}
          <CardBody>
            <Flex direction="column" w="100%" paddingLeft="1.5rem">
              <Text fontSize="md">{shortenAddress(contract)}</Text>
              <Text fontSize="xs">{id}</Text>
            </Flex>
            {/* <Heading size='md'> {shortenAddress(nft.contractAddress)}</Heading>
            <Text>{nft.id}</Text> */}
          </CardBody>
          {/* <Divider /> */}
          {/* <CardFooter>
            <Flex justifyContent={'flex-end'} w='100%'>
              <Button variant='solid' colorScheme='blue'>
                Select
              </Button>
            </Flex>
          </CardFooter> */}
        </Card>
      ))}
    </Stack>
  );
};

const AaveV3 = () => {
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [isSetupACModalOpen, setIsSetupACModalOpen] = useState<boolean>(false);

  return (
    <Flex direction="column" align="center" justify="center">
      <Heading as="h1" size="2xl" mb="1rem">
        AAVE V3
      </Heading>
      <Box display={'flex'} justifyContent={'center'} alignItems={'center'} minH={'100vh'}>
        <Box
          w="42rem"
          className="container"
          position={'relative'}
          // maxHeight='32rem'
          // overflow={'scroll'}
        >
          {selectedAccount ? (
            <TxFrom
              account={selectedAccount}
              handleBackClick={() => {
                setSelectedAccount(undefined);
              }}
            />
          ) : (
            <>
              <ACMAccountList
                onClick={(account: Account) => {
                  setSelectedAccount(account);
                }}
              />
              <IconButton
                colorScheme="blue"
                aria-label="Search database"
                w="100%"
                marginTop={'12px'}
                icon={<AddIcon />}
                onClick={() => {
                  setIsSetupACModalOpen(true);
                }}
              />
            </>
          )}
        </Box>
      </Box>
      <SetupACModal
        isOpen={isSetupACModalOpen}
        onClose={() => {
          setIsSetupACModalOpen(false);
        }}
      />
    </Flex>
  );
};

export default AaveV3;
