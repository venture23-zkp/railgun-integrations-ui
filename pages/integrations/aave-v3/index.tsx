import LiquidityPool from "@/components/liquidityPool";
import { useState } from 'react';
import { Stack, Card, Box, Heading, CardBody, Text, Flex, Divider, ButtonGroup, Button, CardFooter } from '@chakra-ui/react'
import { shortenAddress } from "@/utils/address";

const AaveV3 = () => {
  const [selectedNFT, setSelectedNFT] = useState<NftType>();

  if (selectedNFT) {
    <LiquidityPool nft={selectedNFT} />;
  } else {
    return (
      <Flex direction="column" align="center" justify="center">
        <Heading as="h1" size="2xl" mb="1rem">
          AAVE V3
        </Heading>
        <Box display={"flex"} justifyContent={"center"} alignItems={"center"} height={"100vh"}>
          <Box w="42rem" className="container" maxHeight='32rem' overflow={'scroll'}>
            <NFTLists onClick={(nft: NftType) => { setSelectedNFT(nft) }} />
          </Box>
        </Box>
      </Flex>
    )
  }
};

type NftType = {
  id: number,
  contractAddress: string
}

const nfts: NftType[] = [
  {
    id: 32,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 54,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 54,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 54,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 54,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  },
  {
    id: 54,
    contractAddress: '0x1CFFC31408461d036227F53384B49b80d8580F19'
  }
]

type NFTListsPropsType = {
  onClick: (nft: NftType) => void
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
