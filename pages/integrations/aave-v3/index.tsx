
import { useEffect, useState, useMemo } from 'react';
import { AddIcon } from '@chakra-ui/icons';
import { Box, Card, CardBody, Flex, Heading, IconButton, Stack, Text, Image } from '@chakra-ui/react';
import { useNFT } from '@/contexts/NFTContext';
import { shortenAddress } from '@/utils/address';
import SetupACModal from './SetupACModal';
import { abi } from '@/abi-typechain/abi';
import TxFrom from './components/TxFrom';
import AcmAccountType from '@/types/AcmAccount';
import { EAaveToken, useAaveToken } from '@/contexts/AaveTokenContext';
import { FixedNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils.js';

type ACMAccountListProps = {
  // eslint-disable-next-line no-unused-vars
  onClick: (account: AcmAccountType) => void;
};

const ACMAccountList = ({ onClick }: ACMAccountListProps) => {
  const { accounts } = useNFT();
  const { acTokensWithBalances } = useAaveToken();

  const sortedAcTokensWithBalances = useMemo(() => {
    const sortedAcTokens: any = {};
    for (let acAddr of Object.keys(acTokensWithBalances)) {
      const acAddrTokenTypeObj = acTokensWithBalances[acAddr];
      const accrTokenType = EAaveToken.A_TOKEN;
      const originalToAaveTokenObj = acAddrTokenTypeObj[accrTokenType as EAaveToken];
      const tokensArr = Object.values(originalToAaveTokenObj as any);
      tokensArr.sort((a, b) => {
        if (b.balance?.gt(a.balance || '0x')) {
          return 1;
        } else if (a.balance?.gt(b.balance || '0x')) {
          return -1;
        } else {
          return 0;
        }
      });
      sortedAcTokens[acAddr] = tokensArr
    }
    return sortedAcTokens;
  }, [acTokensWithBalances])

  return (
    <Stack spacing="4">
      {accounts.map(({ id, contract }, i) => (
        <Card
          key={i}
          variant={'elevated'}
          cursor={'pointer'}
          onClick={() => onClick({ id, contract })}
        >
          <CardBody>
            <Flex direction="column" w="100%" paddingLeft="1.5rem">
              <Text fontSize="md">{shortenAddress(contract)}</Text>
              <Text fontSize="xs">{id}</Text>
              <Flex gap="10px" justify={"flex-end"} align={"center"} marginTop={"5px"}>
                {
                  sortedAcTokensWithBalances?.[id]?.slice(0, 3)?.map(token => (
                    <Flex gap="2px" justify={"center"} align={"center"}>
                      <Image
                        borderRadius='full'
                        boxSize='20px'
                        src={token.logoURI}
                        alt={token.symbol}
                      />
                      <Text fontSize="md">
                        {FixedNumber.from(
                          formatUnits(token.balance?.toString() || '0', token?.decimals || 0).toString()
                        )
                          .round(8)
                          .toString() || 0}
                      </Text>
                    </Flex>
                  ))
                }
              </Flex>
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
  const [selectedAccount, setSelectedAccount] = useState<AcmAccountType>();
  const [isSetupACModalOpen, setIsSetupACModalOpen] = useState<boolean>(false);
  const { setSelectedAccount: setSelectedAccountInContext } = useNFT();

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
                setSelectedAccountInContext(undefined);
                setSelectedAccount(undefined);
              }}
            />
          ) : (
            <>
              <ACMAccountList
                onClick={(account: AcmAccountType) => {
                  setSelectedAccountInContext(account);
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
