#!/bin/bash

# create an array of the letters of the alphabet
# letters=(C)
letters=(A B C D E F G H I J K L M N O P Q R S T U V W X Y Z)

# create an empty string to store the table contents
table_contents=""

# iterate over each letter in the array
for letter in "${letters[@]}"; do
  # create the URL for the current letter
  url="https://anglish.fandom.com/wiki/English_Wordbook/${letter}"
  
  echo "curling "${url}""
  
  fullsource=$(curl -s "${url}")
  echo "fullsource length: "${#fullsource}""
  echo "${fullsource}" > fullsource.html

  html=$(echo "${fullsource}" | tr -d '\n')
  echo "html length: "${#html}""
  echo "${html}" > html.html
  
  table=$(echo "${html}" | sed -n 's/.*\(<table.*<\/table>\).*/\1/p')
  echo "table length: "${#table}""

  # append the table contents to the string
  table_contents+="${table}"
done

# write the table contents to a file
echo "<html><body>${table_contents}</body></html>" > english_wordbook.html
