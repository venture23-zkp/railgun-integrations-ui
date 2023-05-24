import LiquidityPool from "@/components/liquidityPool";
import { useEffect, useState } from 'react';
import { Stack, Card, Box, Heading, CardBody, Text, Flex, IconButton } from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons';
import { shortenAddress } from "@/utils/address";
import AddressContractManager from "@/abi/AddressContractManager.json";
import { readContracts } from '@wagmi/core';
import SetupACModal from "./SetupACModal";
import AcmNftType from "@/types/AcmNftType";

const AaveV3 = () => {
  const [selectedNFT, setSelectedNFT] = useState<AcmNftType>();
  const [isSetupACModalOpen, setIsSetupACModalOpen] = useState<boolean>(false);

  if (selectedNFT) {
    return <LiquidityPool acmNft={selectedNFT} />;
  } else {
    return (
      <Flex direction="column" align="center" justify="center">
        <Heading as="h1" size="2xl" mb="1rem">
          AAVE V3
        </Heading>
        <Box display={"flex"} justifyContent={"center"} alignItems={"center"} minH={"100vh"}>
          <Box w="42rem" className="container"
          // maxHeight='32rem'
          // overflow={'scroll'}
          >
            <NFTLists onClick={(nft: AcmNftType) => { setSelectedNFT(nft) }} />
            <IconButton
              colorScheme='blue'
              aria-label='Search database'
              w="100%"
              marginTop={'12px'}
              icon={<AddIcon />}
              onClick={() => { setIsSetupACModalOpen(true) }}
            />
          </Box>
        </Box>
        <SetupACModal isOpen={isSetupACModalOpen} onClose={() => { setIsSetupACModalOpen(false) }} />
      </Flex>
    )
  }
};

const nfts: AcmNftType[] = [
  {
    id: 32,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 54,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 56,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 76,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 234,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 98,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 34534,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 6564564,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
]

type NFTListsPropsType = {
  onClick: (nft: AcmNftType) => void
}

const NFTLists = ({ onClick }: NFTListsPropsType) => {
  return (
    <Stack spacing='4'>
      {nfts.map((nft) => (
        <Card key={nft.id} variant={'elevated'} cursor={'pointer'} onClick={() => onClick(nft)}>
          {/* <CardHeader>
          </CardHeader> */}
          <CardBody>
            <Flex direction="column" w="100%" paddingLeft="1.5rem">
              <Text fontSize="md">{shortenAddress(nft.contractAddress)}</Text>
              <Text fontSize="xs">{nft.id}</Text>
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
  )
}

export default AaveV3;
