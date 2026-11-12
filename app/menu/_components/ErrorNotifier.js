'use client'

import {
  DialogBody,
  DialogContent,
  DialogRoot,
} from "../../../components/ui/dialog";
import { Text } from "@chakra-ui/react";

export default function ErrorNotifier(props) {
  return (
      <DialogRoot 
        open={!!props.error} 
        onOpenChange={() => props.setError(null)}
        placement={'top'}
        motionPreset="slide-in-bottom"
      >
      <DialogContent mt={10} height={'fit-content'} width={'fit-content'} p={5} borderRadius={'md'} background={'#ff5555'}>
        <DialogBody display={'flex'} flexDirection={'row'} justifyContent={'center'} alignItems={'center'} >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <Text color={'white'} marginBottom={0} textAlign={'center'} size={'xl'} ms={3}>{props.error}</Text>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

