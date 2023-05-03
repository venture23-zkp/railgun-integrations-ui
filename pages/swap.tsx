import {
  Box,
  Center,
  useColorModeValue,
  Heading,
  Text,
  Stack,
  Image,
  Input,
  ButtonGroup,
  Button
} from '@chakra-ui/react';

function SwapCard() {
  return (
    <Center py={12}>
      <Box
        role={'group'}
        p={6}
        w={'full'}
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow={'2xl'}
        rounded={'lg'}
        pos={'relative'}
        display={"flex"}
        flexDir={"column"}
        gap={"2"}
        zIndex={1}>
        <Box
          display={"flex"}
          flexDir={"row"}
          gap={"2"}
        >
          <Input placeholder='0' type='number' />
          <ButtonGroup gap='4'>
            <Button colorScheme='teal'>
              ETH
            </Button>
          </ButtonGroup>
        </Box>
        <ButtonGroup
          width={"100%"}
        >
          <Button colorScheme='teal' width={"100%"}>
            Deposit
          </Button>
        </ButtonGroup>
        <Box>
        </Box>
        <Stack pt={10} align={'center'}>
        </Stack>
      </Box>
    </Center>
  );
}

function Swap() {
  return (
    <>
      <Box
        minW={"520px"}
        w={"84%"}
        maxW={"760px"}
        mx={"auto"}
      >
        <Text fontSize="4xl" fontFamily="monospace" fontWeight="bold">
          LP
        </Text>

        <SwapCard />
      </Box>
    </>
  );
}

export default Swap;
