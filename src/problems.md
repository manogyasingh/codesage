# Problem 1

Your task is to divide the numbers 1, 2, ..., n into two sets of equal sum.

## Input

The only input line contains an integer n.

## Output

Print "YES", if the division is possible, and "NO", otherwise.

After this, if the division is possible, print an example of how to create the sets. First, print the number of elements in the first set followed by the elements themselves in a separate line, and then, print the second set in a similar way.

## Constraints

  * 1 \<= n \<= 10^6

## Examples

### Input 1:


7


### Output 1:


YES
4
1 2 4 7
3
3 5 6


### Input 2:


6


### Output 2:


NO


-----

# Problem 2

The Tower of Hanoi game consists of three stacks (left, middle and right) and n round disks of different sizes. Initially, the left stack has all the disks, in increasing order of size from top to bottom.

The goal is to move all the disks to the right stack using the middle stack. On each move you can move the uppermost disk from a stack to another stack. In addition, it is not allowed to place a larger disk on a smaller disk.

Your task is to find a solution that minimizes the number of moves.

## Input

The only input line has an integer n: the number of disks.

## Output

First print an integer k: the minimum number of moves.

After this, print k lines that describe the moves. Each line has two integers a and b: you move a disk from stack a to stack b.

## Constraints

  * 1 \<= n \<= 16

## Example

### Input:


2


### Output:


3
1 2
1 3
2 3


-----

# Problem 3

You are given an array of n integers, and your task is to find two values (at distinct positions) whose sum is x.

## Input

The first input line has two integers n and x: the array size and the target sum.

The second line has n integers a\_1, a\_2, ..., a\_n: the array values.

## Output

Print two integers: the positions of the values. If there are several solutions, you may print any of them. If there are no solutions, print IMPOSSIBLE.

## Constraints

  * 1 \<= n \<= 2 \* 10^5
  * 1 \<= x, a\_i \<= 10^9

## Example

### Input:


4 8
2 7 5 1


### Output:


2 4


-----

# Problem 4

Given an array of n positive integers, your task is to count the number of subarrays having sum x.

## Input

The first input line has two integers n and x: the size of the array and the target sum x.

The next line has n integers a\_1, a\_2, ..., a\_n: the contents of the array.

## Output

Print one integer: the required number of subarrays.

## Constraints

  * 1 \<= n \<= 2 \* 10^5
  * 1 \<= x, a\_i \<= 10^9

## Example

### Input:


5 7
2 4 1 2 7


### Output:


3


-----

# Problem 5

Consider a money system consisting of n coins. Each coin has a positive integer value. Your task is to calculate the number of distinct ways you can produce a money sum x using the available coins.

For example, if the coins are {2,3,5} and the desired sum is 9, there are 8 ways:

  * 2+2+5
  * 2+5+2
  * 5+2+2
  * 3+3+3
  * 2+2+2+3
  * 2+2+3+2
  * 2+3+2+2
  * 3+2+2+2

## Input

The first input line has two integers n and x: the number of coins and the desired sum of money.

The second line has n distinct integers c\_1, c\_2, ..., c\_n: the value of each coin.

## Output

Print one integer: the number of ways modulo 10^9+7.

## Constraints

  * 1 \<= n \<= 100
  * 1 \<= x \<= 10^6
  * 1 \<= c\_i \<= 10^6

## Example

### Input:


3 9
2 3 5


### Output:


8


-----

# Problem 6

There are n cities and m flight connections between them. Your task is to determine the length of the shortest route from Syrjälä to every city.

## Input

The first input line has two integers n and m: the number of cities and flight connections. The cities are numbered 1, 2, ..., n, and city 1 is Syrjälä.

After that, there are m lines describing the flight connections. Each line has three integers a, b and c: a flight begins at city a, ends at city b, and its length is c. Each flight is a one-way flight.

You can assume that it is possible to travel from Syrjälä to all other cities.

## Output

Print n integers: the shortest route lengths from Syrjälä to cities 1, 2, ..., n.

## Constraints

  * 1 \<= n \<= 10^5
  * 1 \<= m \<= 2 \* 10^5
  * 1 \<= a, b \<= n
  * 1 \<= c \<= 10^9

## Example

### Input:


3 4
1 2 6
1 3 2
3 2 3
1 3 4


### Output:


0 5 2


-----

# Problem 7

Given an array of n integers, your task is to process q queries of the following types:

1.  update the value at position k to u
2.  what is the sum of values in range [a,b]?

## Input

The first input line has two integers n and q: the number of values and queries.

The second line has n integers x\_1, x\_2, ..., x\_n: the array values.

Finally, there are q lines describing the queries. Each line has three integers: either "1 k u" or "2 a b".

## Output

Print the result of each query of type 2.

## Constraints

  * 1 \<= n, q \<= 2 \* 10^5
  * 1 \<= x\_i, u \<= 10^9
  * 1 \<= k \<= n
  * 1 \<= a \<= b \<= n

## Example

### Input:


8 4
3 2 4 5 1 1 5 3
2 1 4
2 5 6
1 3 1
2 1 4


### Output:


14
2
11


-----

# Problem 8

You are given a rooted tree consisting of n nodes. The nodes are numbered 1, 2, ..., n, and node 1 is the root. Each node has a value.

Your task is to process following types of queries:

1.  change the value of node s to x
2.  calculate the sum of values in the subtree of node s

## Input

The first input line contains two integers n and q: the number of nodes and queries. The nodes are numbered 1, 2, ..., n.

The next line has n integers v\_1, v\_2, ..., v\_n: the value of each node.

Then there are n-1 lines describing the edges. Each line contains two integers a and b: there is an edge between nodes a and b.

Finally, there are q lines describing the queries. Each query is either of the form "1 s x" or "2 s".

## Output

Print the answer to each query of type 2.

## Constraints

  * 1 \<= n, q \<= 2 \* 10^5
  * 1 \<= a, b, s \<= n
  * 1 \<= v\_i, x \<= 10^9

## Example

### Input:


5 3
4 2 5 2 1
1 2
1 3
3 4
3 5
2 3
1 5 3
2 3


### Output:


8
10


-----

# Problem 9

You are given k distinct prime numbers a\_1, a\_2, ..., a\_k and an integer n.

Your task is to calculate how many of the first n positive integers are divisible by at least one of the given prime numbers.

## Input

The first input line has two integers n and k.

The second line has k prime numbers a\_1, a\_2, ..., a\_k.

## Output

Print one integer: the number of integers within the interval 1, 2, ..., n that are divisible by at least one of the prime numbers.

## Constraints

  * 1 \<= n \<= 10^18
  * 1 \<= k \<= 20
  * 2 \<= a\_i \<= n

## Example

### Input:


20 2
2 5


### Output:


12


## Explanation:

The 12 numbers are 2, 4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 20.

-----

# Problem 10

You are given a string that consists of n characters between a–z. The positions of the string are indexed 1, 2, ..., n.

Your task is to process m operations of the following types:

1.  Change the character at position k to x
2.  Check if the substring from position a to position b is a palindrome

## Input

The first input line has two integers n and m: the length of the string and the number of operations.

The next line has a string that consists of n characters.

Finally, there are m lines that describe the operations. Each line is of the form "1 k x" or "2 a b".

## Output

For each operation 2, print YES if the substring is a palindrome and NO otherwise.

## Constraints

  * 1 \<= n, m \<= 2 \* 10^5
  * 1 \<= k \<= n
  * 1 \<= a \<= b \<= n

## Example

### Input:


7 5
aybabtu
2 3 5
1 3 x
2 3 5
1 5 x
2 3 5


### Output:


YES
NO
YES


-----

# Problem 11

You are given an array of n integers. Your task is to calculate the median of each window of k elements, from left to right.

The median is the middle element when the elements are sorted. If the number of elements is even, there are two possible medians and we assume that the median is the smaller of them.

## Input

The first line contains two integers n and k: the number of elements and the size of the window.

Then there are n integers x\_1, x\_2, ..., x\_n: the contents of the array.

## Output

Print n-k+1 values: the medians.

## Constraints

  * 1 \<= k \<= n \<= 2 \* 10^5
  * 1 \<= x\_i \<= 10^9

## Example

### Input:


8 3
2 4 3 5 8 1 2 1


### Output:


3 4 5 5 2 1